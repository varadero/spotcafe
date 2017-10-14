ALTER TABLE dbo.Clients ADD
	Credit money NULL

GO

UPDATE [Clients]
SET [Credit]=0

ALTER TABLE [Clients]
ALTER COLUMN [Credit] money NOT NULL

UPDATE [Settings] SET [Value]='2017-10-13 12:26:00' WHERE [Name]='database.version'