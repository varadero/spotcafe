using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;

namespace SpotCafe.Desktop {
    public class Serializer {
        public string Serialize<Т>(Т obj) {
            var ser = GetSerializer(obj.GetType());
            var ms = new MemoryStream();
            ser.WriteObject(ms, obj);
            var result = Encoding.UTF8.GetString(ms.ToArray());
            return result;
        }

        public T Deserialize<T>(string value) {
            var ser = GetSerializer(typeof(T));
            var ms = new MemoryStream(Encoding.UTF8.GetBytes(value));
            var result = (T)ser.ReadObject(ms);
            return result;
        }

        private DataContractJsonSerializer GetSerializer(Type t) {
            return new DataContractJsonSerializer(t);
        }
    }
}
