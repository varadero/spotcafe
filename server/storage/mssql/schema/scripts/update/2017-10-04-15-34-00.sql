UPDATE [ClientDevices]
SET [DeviceGroupId]='E000F85C-06ED-4EF4-8C3A-FEDB89EA9EE4'

ALTER TABLE [ClientDevices]
ALTER COLUMN [DeviceGroupId] uniqueidentifier NOT NULL

ALTER TABLE dbo.ClientDevices ADD CONSTRAINT
	FK_ClientDevices_DeviceGroupId_DevicesGroups_Id FOREIGN KEY
	(
	DeviceGroupId
	) REFERENCES dbo.DevicesGroups
	(
	Id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 

UPDATE [Settings] SET [Value]='2017-10-04 15:34:00' WHERE [Name]='database.version'