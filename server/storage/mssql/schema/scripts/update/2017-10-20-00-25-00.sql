CREATE NONCLUSTERED INDEX IX_ClientDevicesStatusHistory_StartedByClientId ON dbo.ClientDevicesStatusHistory
	(
	StartedByClientId
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

CREATE NONCLUSTERED INDEX IX_ClientDevicesStatusHistory_StartedByEmployeeId ON dbo.ClientDevicesStatusHistory
	(
	StartedByEmployeeId
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

UPDATE [Settings] SET [Value]='2017-10-20 00:25:00' WHERE [Name]='database.version'