CREATE TABLE [dbo].[ClientDevicesStatusHistory](
	[Id] [uniqueidentifier] NOT NULL,
	[DeviceId] [nvarchar](100) NOT NULL,
	[StartedByClientId] [uniqueidentifier] NULL,
	[StartedByEmployeeId] [uniqueidentifier] NULL,
	[StartedAt] [decimal](16, 0) NOT NULL,
	[StartedAtUptime] [decimal](16, 0) NOT NULL,
	[StoppedByEmployeeId] [uniqueidentifier] NULL,
	[StoppedAt] [decimal](16, 0) NOT NULL,
	[StoppedAtUptime] [decimal](16, 0) NOT NULL,
	[Bill] [money] NOT NULL
 CONSTRAINT [PK_ClientDevicesStatusHistory] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


CREATE NONCLUSTERED INDEX [IX_StartedAt_StoppedAt] ON [dbo].[ClientDevicesStatusHistory]
(
	[StartedAt] DESC,
	[StoppedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]


ALTER TABLE [dbo].[ClientDevicesStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_ClientDevicesStatusHistory_StoppedByEmployeeId_Employees_Id] FOREIGN KEY([StoppedByEmployeeId])
REFERENCES [dbo].[Employees] ([Id])


ALTER TABLE [dbo].[ClientDevicesStatusHistory] CHECK CONSTRAINT [FK_ClientDevicesStatusHistory_StoppedByEmployeeId_Employees_Id]


ALTER TABLE [dbo].[ClientDevicesStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_ClientDevicesStatusHistory_DeviceId_ClientDevices_Id] FOREIGN KEY([DeviceId])
REFERENCES [dbo].[ClientDevices] ([Id])


ALTER TABLE [dbo].[ClientDevicesStatusHistory] CHECK CONSTRAINT [FK_ClientDevicesStatusHistory_DeviceId_ClientDevices_Id]


ALTER TABLE [dbo].[ClientDevicesStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_ClientDevicesStatusHistory_StartedByClientId_Clients_Id] FOREIGN KEY([StartedByClientId])
REFERENCES [dbo].[Clients] ([Id])


ALTER TABLE [dbo].[ClientDevicesStatusHistory] CHECK CONSTRAINT [FK_ClientDevicesStatusHistory_StartedByClientId_Clients_Id]


ALTER TABLE [dbo].[ClientDevicesStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_ClientDevicesStatusHistory_StartedByEmployeeId_EmployeeId] FOREIGN KEY([StartedByEmployeeId])
REFERENCES [dbo].[Employees] ([Id])


ALTER TABLE [dbo].[ClientDevicesStatusHistory] CHECK CONSTRAINT [FK_ClientDevicesStatusHistory_StartedByEmployeeId_EmployeeId]


ALTER TABLE [dbo].[ClientDevicesStatusHistory]  WITH CHECK ADD  CONSTRAINT [FK_StartedByClientId_Clients_Id] FOREIGN KEY([StartedByClientId])
REFERENCES [dbo].[Clients] ([Id])


ALTER TABLE [dbo].[ClientDevicesStatusHistory] CHECK CONSTRAINT [FK_StartedByClientId_Clients_Id]

UPDATE [Settings] SET [Value]='2017-10-07 12:58:00' WHERE [Name]='database.version'