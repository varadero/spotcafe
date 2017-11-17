ALTER TABLE dbo.Settings ADD
	DataType nvarchar(50) NULL

GO

INSERT INTO [Settings]
([Name], [Value], [IsSystem], [DataType]) VALUES
('clientDevice.startupRegistryEntries', '', 0, 'multiline-text')

UPDATE [Settings]
SET [DataType]='number'
WHERE [Name]='bills.calculateInterval' 

UPDATE [Settings]
SET [DataType]='json'
WHERE [Name]='client.files' 

UPDATE [Settings]
SET [DataType]='number'
WHERE [Name]='clientDevice.restartAfterIdleFor' 

UPDATE [Settings]
SET [DataType]='number'
WHERE [Name]='clientDevice.shutdownAfterIdleFor' 

UPDATE [Settings]
SET [DataType]='text'
WHERE [Name]='database.version' 

UPDATE [Settings]
SET [DataType]='text'
WHERE [Name]='token.secret' 

UPDATE [Settings] SET [Value]='2017-11-17 22:30:00' WHERE [Name]='database.version'