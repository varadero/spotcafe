using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SpotCafe.Service.WindowsRegistry {
    public class RegDataReader {

        private RegDataReaderState _state;

        public void Init(string fileContent) {
            InitializeState();
            fileContent = Regex.Replace(fileContent, @"\r\n?|\n", Environment.NewLine);
            _state.Reader = new StringReader(fileContent);
            ReadToFirstSection();
        }

        public RegRecord Next() {
            var nextRecordLines = ReadNextRecordLines();
            var record = ToRegRecord(nextRecordLines);
            return record;
        }

        private List<string> ReadNextRecordLines() {
            var lines = new List<string>();
            if (_state.LastLineRead != null) {
                lines.Add(_state.LastLineRead);
                _state.LastLineRead = null;
            }
            while (true) {
                _state.LastLineRead = _state.Reader.ReadLine();
                if (_state.LastLineRead == null) {
                    break;
                }
                if (_state.LastLineRead.StartsWith("[")) {
                    break;
                } else {
                    lines.Add(_state.LastLineRead);
                }
            }
            return lines;
        }

        private RegRecord ToRegRecord(IEnumerable<string> lines) {
            var record = new RegRecord { Items = new List<RegItem>() };
            var enumerator = lines.GetEnumerator();
            while (enumerator.MoveNext()) {
                var line = enumerator.Current;
                var trimmed = line.Trim();
                if (trimmed.StartsWith("[")) {
                    record.Key = trimmed.TrimStart('[').TrimEnd(']');
                    if (record.Key.StartsWith("-")) {
                        record.Key = record.Key.Substring(1);
                        record.MustRemove = true;
                    }
                } else {
                    var itemLines = new List<string>();
                    if (!string.IsNullOrWhiteSpace(record.Key) && !string.IsNullOrWhiteSpace(trimmed)) {
                        if (trimmed.EndsWith("\\")) {
                            itemLines.Add(trimmed.TrimEnd(new[] { '\\' }));
                            // There are more lines 
                            while (enumerator.MoveNext()) {
                                var nextLine = enumerator.Current;
                                itemLines.Add(nextLine.Trim().TrimEnd(new[] { '\\' }));
                                if (!nextLine.EndsWith("\\")) {
                                    // This is the last line
                                    break;
                                }
                            }
                        } else {
                            itemLines.Add(trimmed);
                        }
                        line = string.Join(string.Empty, itemLines.ToArray());
                        var regItem = ToRegItem(line);
                        if (regItem != null) {
                            record.Items.Add(regItem);
                        }
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(record.Key)) {
                return null;
            }
            return record;
        }

        private RegItem ToRegItem(string line) {
            if (string.IsNullOrWhiteSpace(line)) {
                return null;
            }
            if (line.Trim().StartsWith(";")) {
                // This is comment
                return null;
            }
            var item = new RegItem();
            if (string.IsNullOrWhiteSpace(line)) {
                item.Error = new RegItemParseError { Message = "Item is empty" };
                return item;
            }
            var parts = line.Split(new[] { "=" }, 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) {
                item.Error = new RegItemParseError { Message = $"Item '{line}' should have at two parts separated with '=' but {parts.Length} found" };
                return item;
            }
            if (parts[0] == "@") {
                // This is the default value - we should simply remove it and set empty string as a name
                // This means the value will be saved into default one
                item.Name = "";
            } else {
                item.Name = TrimString(parts[0]);
                if (string.IsNullOrWhiteSpace(item.Name)) {
                    item.Error = new RegItemParseError { Message = $"Item '{line}' does not have a name" };
                    return item;
                }
            }

            var valueParts = parts[1].Split(new[] { ":" }, 2, StringSplitOptions.RemoveEmptyEntries);
            if (valueParts.Length != 1 && valueParts.Length != 2) {
                item.Error = new RegItemParseError { Message = $"Item '{line}' should have one or two parts but {valueParts.Length} found" };
                return item;
            }

            if (valueParts.Length == 1 && valueParts[0] == "-") {
                item.MustRemove = true;
                return item;
            }

            if (valueParts.Length == 1 && valueParts[0].StartsWith("\"")) {
                // String
                item.Kind = RegistryValueKind.String;
                item.Value = UnescapeString(TrimString(valueParts[0]));
            } else {
                var typeName = valueParts[0];
                var value = valueParts.Length == 2 ? valueParts[1] : "";
                if (typeName == "dword") {
                    // 32 bit Integer
                    item.Kind = RegistryValueKind.DWord;
                    item.Value = Convert.ToInt32(value, 16);
                } else if (typeName == "hex") {
                    // Byte array
                    item.Kind = RegistryValueKind.Binary;
                    if (!string.IsNullOrWhiteSpace(value)) {
                        item.Value = GetBytes(value);
                    } else {
                        item.Value = new byte[0];
                    }
                } else if (typeName == "hex(b)") {
                    // 64 bit Integer
                    item.Kind = RegistryValueKind.QWord;
                    item.Value = BitConverter.ToInt64(GetBytes(value), 0);
                } else if (typeName == "hex(2)") {
                    item.Kind = RegistryValueKind.ExpandString;
                    var bytes = GetBytes(value);
                    item.Value = Encoding.Unicode.GetString(bytes.Take(bytes.Length - 2).ToArray());
                } else if (typeName == "hex(7)") {
                    item.Kind = RegistryValueKind.MultiString;
                    var bytes = GetBytes(value);
                    var singleString = Encoding.Unicode.GetString(bytes.Take(bytes.Length - 2).ToArray());
                    item.Value = singleString.Split(new[] { "\0" }, StringSplitOptions.RemoveEmptyEntries);
                } else {
                    item.Error = new RegItemParseError { Message = $"Item '{line}' type {typeName} is not supported" };
                }
            }
            return item;
        }

        private byte[] GetBytes(string commaSeparatedString) {
            var strings = commaSeparatedString.Split(new[] { "," }, StringSplitOptions.RemoveEmptyEntries);
            return strings.Select(x => Convert.ToByte(x.Substring(0, 2), 16)).ToArray();
        }

        private string TrimString(string value) {
            var trimmed = value.Trim();
            if (trimmed.StartsWith("\"")) {
                trimmed = trimmed.Substring(1);
            }
            if (trimmed.EndsWith("\"")) {
                trimmed = trimmed.Substring(0, trimmed.Length - 1);
            }
            return trimmed;
        }

        private string UnescapeString(string value) {
            var escapedQuote = value.Replace("\\\"", "\"");
            var escapedBacklash = escapedQuote.Replace("\\\\", "\\");
            return escapedBacklash;
        }

        private void ReadToFirstSection() {
            while (true) {
                _state.LastLineRead = _state.Reader.ReadLine();
                if (_state.LastLineRead == null) {
                    break;
                }
                if (_state.LastLineRead.StartsWith("[")) {
                    break;
                }
            }
        }

        private void InitializeState() {
            _state = new RegDataReaderState();
        }

        private class RegDataReaderState {
            public string File { get; set; }
            public StringReader Reader { get; set; }
            public string LastLineRead { get; set; }
        }
    }

    [DebuggerDisplay("{Key}")]
    public class RegRecord {
        public bool MustRemove { get; set; }
        public string Key { get; set; }
        public List<RegItem> Items { get; set; }
    }

    [DebuggerDisplay("{Name} {Value} {Error != null ? Error.Message : null}")]
    public class RegItem {
        public RegistryValueKind Kind { get; set; }
        public string Name { get; set; }
        public bool MustRemove { get; set; }
        public object Value { get; set; }
        public RegItemParseError Error { get; set; }
    }

    public class RegItemParseError {
        public string Message { get; set; }
    }
}
