CREATE TABLE [dbo].[ClientsGroups](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[PricePerHour] [money] NOT NULL,
 CONSTRAINT [PK_ClientsGroups_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

CREATE UNIQUE NONCLUSTERED INDEX [IX_ClientsGroups_Name] ON [dbo].[ClientsGroups]
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]


ALTER TABLE dbo.Clients ADD
	ClientGroupId uniqueidentifier NULL
GO
ALTER TABLE dbo.Clients ADD CONSTRAINT
	FK_Clients_ClientGroupId_ClientsGroups_Id FOREIGN KEY
	(
	ClientGroupId
	) REFERENCES dbo.ClientsGroups
	(
	Id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 

CREATE TABLE [dbo].[ClientsGroupsWithDevicesGroups](
	[ClientGroupId] [uniqueidentifier] NOT NULL,
	[DeviceGroupId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ClientsGroupsWithDevicesGroups] PRIMARY KEY CLUSTERED 
(
	[ClientGroupId] ASC,
	[DeviceGroupId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[ClientsGroupsWithDevicesGroups]  WITH CHECK ADD  CONSTRAINT [FK_ClientsGroupsWithDevicesGroups_ClientGroupId_ClientsGroups_Id] FOREIGN KEY([ClientGroupId])
REFERENCES [dbo].[ClientsGroups] ([Id])
GO

ALTER TABLE [dbo].[ClientsGroupsWithDevicesGroups] CHECK CONSTRAINT [FK_ClientsGroupsWithDevicesGroups_ClientGroupId_ClientsGroups_Id]
GO

ALTER TABLE [dbo].[ClientsGroupsWithDevicesGroups]  WITH CHECK ADD  CONSTRAINT [FK_ClientsGroupsWithDevicesGroups_DeviceGroupId_DevicesGroups_Id] FOREIGN KEY([DeviceGroupId])
REFERENCES [dbo].[DevicesGroups] ([Id])
GO

ALTER TABLE [dbo].[ClientsGroupsWithDevicesGroups] CHECK CONSTRAINT [FK_ClientsGroupsWithDevicesGroups_DeviceGroupId_DevicesGroups_Id]
GO

INSERT INTO [ClientsGroups]
([Id], [Name], [Description], [PricePerHour]) VALUES
('D10F87D8-A024-4E56-8E62-004F8322E5B2', 'Default', 'Default client group', 1)

UPDATE [Settings] SET [Value]='2017-10-08 22:27:00' WHERE [Name]='database.version'