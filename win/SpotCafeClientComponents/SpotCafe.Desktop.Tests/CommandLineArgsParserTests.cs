using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SpotCafe.Desktop.Tests {
    [TestClass]
    public class CommandLineArgsParserTests {
        [TestMethod]
        public void ParseEmptyArgsTest() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[0]);
            Assert.AreEqual(null, result.ClientDeviceId, "should not set ClientDeviceId on empty array");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP on empty array");
            Assert.AreEqual(null, result.ServerCertificateThumbprint, "should not set ServerCertificateThumbprint on empty array");

        }

        [TestMethod]
        public void ParseNoItemsFound() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=value" });
            Assert.AreEqual(null, result.ClientDeviceId, "should not set ClientDeviceId if not found");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP if not found");
            Assert.AreEqual(null, result.ServerCertificateThumbprint, "should not set ServerCertificateThumbprint if not found");
        }

        [TestMethod]
        public void ParseWhenNoSeparators() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown-value", "client-device-Id-clientdeviceid-value", "server-Ip-server-ip-value", "server-certificate-thumprint-value" });
            Assert.AreEqual(null, result.ClientDeviceId, "should not set ClientDeviceId if not found");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP if not found");
            Assert.AreEqual(null, result.ServerCertificateThumbprint, "should not set ServerCertificateThumbprint if not found");
        }

        [TestMethod]
        public void ParseWhenNoValue() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=", "client-device-Id=", "server-Ip=", "SERVER-certificate-thumprint=" });
            Assert.AreEqual(null, result.ClientDeviceId, "should not set ClientDeviceId if no value");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP if no value");
            Assert.AreEqual(null, result.ServerCertificateThumbprint, "should not set ServerCertificateThumbprint if no value");
        }

        [TestMethod]
        public void ParseWhenItemsFound() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=value", "client-device-Id=clientdeviceid-value", "server-Ip=serverip-value", "Server-CERTIFICATE-thumbprint=0123456789ABCDEF" });
            Assert.AreEqual("clientdeviceid-value", result.ClientDeviceId, "should set ClientDeviceId if found");
            Assert.AreEqual("serverip-value", result.ServerIP, "should set ServerIP if found");
            Assert.AreEqual("0123456789ABCDEF", result.ServerCertificateThumbprint, "should set ServerCertificateThumbprint if found");
        }

        [TestMethod]
        public void ParseWhenMoreThanOneSeparatorFound() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=val=ue", "client-device-Id=clientdevice=id-value", "server-Ip=server=ip-value", "server-certificate-thumbprint=0123456789ABCDEF" });
            Assert.AreEqual("clientdevice=id-value", result.ClientDeviceId, "should set ClientDeviceId if found");
            Assert.AreEqual("server=ip-value", result.ServerIP, "should set ServerIP if found");
        }
    }
}
