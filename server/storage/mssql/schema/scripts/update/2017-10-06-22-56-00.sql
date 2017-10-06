ALTER TABLE dbo.ClientDevicesStatus ADD
	StartedAtUptime bigint NULL,
	StoppedAtUptime bigint NULL,
	LastBill money NULL

UPDATE [Settings] SET [Value]='2017-10-06 22:56:00' WHERE [Name]='database.version'