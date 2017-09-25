ALTER TABLE dbo.ClientDevicesStatus ADD
	StoppedAt bigint NULL

UPDATE [Settings] SET [Value]='2017-09-26 02:34:00' WHERE [Name]='database.version'