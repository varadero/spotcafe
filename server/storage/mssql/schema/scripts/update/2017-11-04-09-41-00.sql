ALTER TABLE dbo.ApplicationProfilesFiles ADD
	Title nvarchar(250) NULL
GO

UPDATE [Settings] SET [Value]='2017-11-04 09:41:00' WHERE [Name]='database.version'