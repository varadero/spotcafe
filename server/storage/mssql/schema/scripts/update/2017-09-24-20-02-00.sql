CREATE TABLE [dbo].[Clients](
	[Id] [uniqueidentifier] NOT NULL,
	[Username] [nvarchar](250) NOT NULL,
	[Password] [nvarchar](250) NOT NULL,
	[Email] [nvarchar](250) NULL,
	[FirstName] [nvarchar](250) NULL,
	[LastName] [nvarchar](250) NULL,
	[Phone] [nvarchar](50) NULL,
 CONSTRAINT [PK_Clients_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE [dbo].[ClientDevicesStatus](
	[DeviceId] [nvarchar](100) NOT NULL,
	[IsStarted] [bit] NOT NULL,
	[StartedAt] [bigint] NULL,
	[StartedFor] [uniqueidentifier] NULL,
 CONSTRAINT [PK_ClientDevicesStatus] PRIMARY KEY CLUSTERED 
(
	[DeviceId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

ALTER TABLE [dbo].[ClientDevicesStatus]  WITH CHECK ADD  CONSTRAINT [FK_ClientDevicesStatus_Clients] FOREIGN KEY([StartedFor])
REFERENCES [dbo].[Clients] ([Id])

ALTER TABLE [dbo].[ClientDevicesStatus] CHECK CONSTRAINT [FK_ClientDevicesStatus_Clients]

ALTER TABLE [dbo].[ClientDevicesStatus]  WITH CHECK ADD  CONSTRAINT [FK_ClientDevicesStatus_DeviceId_ClientDevices_Id] FOREIGN KEY([DeviceId])
REFERENCES [dbo].[ClientDevices] ([Id])

ALTER TABLE [dbo].[ClientDevicesStatus] CHECK CONSTRAINT [FK_ClientDevicesStatus_DeviceId_ClientDevices_Id]

INSERT INTO [dbo].[Roles]
([Id], [Name], [Description]) VALUES
('4771B508-6909-482D-9644-E54CB2952333', 'Operator', 'Gives access to operator activities')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('23C1D054-11D6-4DCB-A597-67F665D6328B', 'Client devices status - View', 'Can view client devices status')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('23C1D054-11D6-4DCB-A597-67F665D6328B','4771B508-6909-482D-9644-E54CB2952333')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('23C1D054-11D6-4DCB-A597-67F665D6328B','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-09-24 20:02:00' WHERE [Name]='database.version'