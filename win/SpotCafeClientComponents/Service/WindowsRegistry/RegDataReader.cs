using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Service.WindowsRegistry {
    public class RegDataReader {

        private RegDataReaderState _state;

        public void Init(string fileContent) {
            InitializeState();
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
            foreach (var line in lines) {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("[")) {
                    record.Key = trimmed.TrimStart('[').TrimEnd(']');
                    if (record.Key.StartsWith("-")) {
                        record.Key = record.Key.Substring(1);
                        record.MustRemove = true;
                    }
                } else {
                    if (!string.IsNullOrWhiteSpace(record.Key) && !string.IsNullOrWhiteSpace(trimmed)) {
                        var regItem = ToRegItem(trimmed);
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
            item.Name = TrimString(parts[0]);
            if (string.IsNullOrWhiteSpace(item.Name)) {
                item.Error = new RegItemParseError { Message = $"Item '{line}' does not have a name" };
                return item;
            }
            if (item.Name.StartsWith(";")) {
                // This is comment
                return null;
            }
            var valueParts = parts[1].Split(new[] { ":" }, 2, StringSplitOptions.RemoveEmptyEntries);
            if (valueParts.Length != 1 && valueParts.Length != 2) {
                item.Error = new RegItemParseError { Message = $"Item '{line}' should have one or two parts but {valueParts.Length} found" };
                return item;
            }

            item.IsDefault = (item.Name == "@");
            if (valueParts.Length == 1) {
                item.Kind = RegistryValueKind.String;
                if (valueParts[0] == "-") {
                    item.MustRemove = true;
                } else {
                    item.StringValue = UnescapeString(TrimString(valueParts[0]));
                }
            } else {
                var typeName = valueParts[0];
                var value = valueParts[1];
                if (typeName == "dword") {
                    item.Kind = RegistryValueKind.DWord;
                    item.IntValue = Convert.ToInt32(value, 16);
                } else {
                    item.Error = new RegItemParseError { Message = $"Item '{line}' type {typeName} is not supported" };
                }
            }
            return item;
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

    [DebuggerDisplay("{Name} {IntValue} {StringValue} {Error != null ? Error.Message : null}")]
    public class RegItem {
        public RegistryValueKind Kind { get; set; }
        public string Name { get; set; }
        public string StringValue { get; set; }
        public int? IntValue { get; set; }
        public bool MustRemove { get; set; }
        public bool IsDefault { get; set; }
        public RegItemParseError Error { get; set; }
    }

    public class RegItemParseError {
        public string Message { get; set; }
    }
}
