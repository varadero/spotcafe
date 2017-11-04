ALTER TABLE dbo.ApplicationProfilesFiles ADD
	StartupParameters nvarchar(MAX) NULL

UPDATE [Settings] SET [Value]='2017-11-04 19:48:00' WHERE [Name]='database.version'