ALTER TABLE dbo.[DevicesGroups] ADD
	PricePerHour money NULL

GO

UPDATE [DevicesGroups]
SET [PricePerHour] = 0

ALTER TABLE dbo.[DevicesGroups]
ALTER COLUMN PricePerHour money NOT NULL

UPDATE [Settings] SET [Value]='2017-10-05 21:50:00' WHERE [Name]='database.version'