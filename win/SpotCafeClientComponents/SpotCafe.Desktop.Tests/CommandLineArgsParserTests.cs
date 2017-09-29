using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace SpotCafe.Desktop.Tests {
    [TestClass]
    public class CommandLineArgsParserTests {
        [TestMethod]
        public void ParseEmptyArgsTest() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[0]);
            Assert.AreEqual(null, result.ClientID, "should not set ClientID on empty array");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP on empty array");
        }

        [TestMethod]
        public void ParseNoItemsFound() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=value" });
            Assert.AreEqual(null, result.ClientID, "should not set ClientID if not found");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP if not found");
        }

        [TestMethod]
        public void ParseWhenNoSeparators() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown-value", "clientId-clientid-value", "serverIp-server-ip-value" });
            Assert.AreEqual(null, result.ClientID, "should not set ClientID if not found");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP if not found");
        }

        [TestMethod]
        public void ParseWhenNoValue() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=", "clientId=", "serverIp=" });
            Assert.AreEqual(null, result.ClientID, "should not set ClientID if no value");
            Assert.AreEqual(null, result.ServerIP, "should not set ServerIP if no value");
        }

        [TestMethod]
        public void ParseWhenItemsFound() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=value", "clientId=clientid-value", "serverIp=serverip-value" });
            Assert.AreEqual("clientid-value", result.ClientID, "should set ClientID if found");
            Assert.AreEqual("serverip-value", result.ServerIP, "should set ServerIP if found");
        }

        [TestMethod]
        public void ParseWhenMoreThanOneSeparatorFound() {
            CommandLineArgsParser parser = new CommandLineArgsParser();
            var result = parser.Parse(new string[] { "unknown=val=ue", "clientId=client=id-value", "serverIp=server=ip-value" });
            Assert.AreEqual("client=id-value", result.ClientID, "should set ClientID if found");
            Assert.AreEqual("server=ip-value", result.ServerIP, "should set ServerIP if found");
        }
    }
}
