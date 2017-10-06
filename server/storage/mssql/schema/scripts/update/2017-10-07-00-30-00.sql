ALTER TABLE [ClientDevices]
ALTER COLUMN [ApprovedAt] decimal(16,0) NULL

ALTER TABLE [ClientDevicesStatus]
ALTER COLUMN [StartedAt] decimal(16,0) NULL

ALTER TABLE [ClientDevicesStatus]
ALTER COLUMN [StoppedAt] decimal(16,0) NULL

ALTER TABLE [ClientDevicesStatus]
ALTER COLUMN [StartedAtUptime] decimal(16,0) NULL

ALTER TABLE [ClientDevicesStatus]
ALTER COLUMN [StoppedAtUptime] decimal(16,0) NULL

UPDATE [Settings] SET [Value]='2017-10-07 00:30:00' WHERE [Name]='database.version'