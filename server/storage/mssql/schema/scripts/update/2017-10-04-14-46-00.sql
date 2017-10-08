CREATE TABLE [dbo].[DevicesGroups](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[PricePerHour] money NOT NULL
 CONSTRAINT [PK_DevicesGroups_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

CREATE UNIQUE NONCLUSTERED INDEX [IX_DevicesGroups_Name] ON [dbo].[DevicesGroups]
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

CREATE UNIQUE NONCLUSTERED INDEX [IX_Clients_Username] ON [dbo].[Clients]
(
	[Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]


INSERT INTO [DevicesGroups]
([Id], [Name], [Description], [PricePerHour]) VALUES
('E000F85C-06ED-4EF4-8C3A-FEDB89EA9EE4', 'Default','Default group', 0)

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('0757BE66-05B8-425E-ACBC-64D32D06827F', 'Devices groups - View', 'Can view devices groups')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('0887CD1B-D3C7-4F75-99DE-475A01CA251C', 'Devices groups - Modify', 'Can modify devices groups')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('0757BE66-05B8-425E-ACBC-64D32D06827F','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('0887CD1B-D3C7-4F75-99DE-475A01CA251C','D2595A95-630C-4E66-9B2E-1F804154FDF5')

ALTER TABLE dbo.ClientDevices ADD
	DeviceGroupId uniqueidentifier NULL

UPDATE [Settings] SET [Value]='2017-10-04 14:46:00' WHERE [Name]='database.version'