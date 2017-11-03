INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('8EFDAB66-3323-4885-860C-43978F4743DF', 'Application profiles - View', 'Can view application profiles')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('63C03B2B-BDC7-483E-910B-F1FFE0C3C119', 'Application profiles - Modify', 'Can modify application profiles')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('8EFDAB66-3323-4885-860C-43978F4743DF','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('63C03B2B-BDC7-483E-910B-F1FFE0C3C119','D2595A95-630C-4E66-9B2E-1F804154FDF5')

GO

CREATE TABLE [dbo].[ApplicationGroups](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
 CONSTRAINT [PK_ApplicationGroups] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_ApplicationGroups_Name] ON [dbo].[ApplicationGroups]
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

CREATE TABLE [dbo].[ApplicationProfiles](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
 CONSTRAINT [PK_ApplicationProfiles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

CREATE UNIQUE NONCLUSTERED INDEX [IX_ApplicationProfiles_Name] ON [dbo].[ApplicationProfiles]
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO

INSERT INTO [ApplicationProfiles]
([Id], [Name], [Description]) VALUES
('D5EF0DED-7944-45EE-9A5C-BEA68C274E89', 'Default', 'Default application profile')
GO

CREATE TABLE [dbo].[ApplicationProfilesFiles](
	[Id] [uniqueidentifier] NOT NULL,
	[FilePath] [nvarchar](max) NULL,
	[ApplicationGroupId] [uniqueidentifier] NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Image] [nvarchar](max) NULL,
	[ImageFileName] [nvarchar](max) NULL,
	[ApplicationProfileId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_ApplicationProfilesFiles] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[ApplicationProfilesFiles]  WITH CHECK ADD  CONSTRAINT [FK_ApplicationProfilesFiles_ApplicationGroupId_ApplicationGroups_Id] FOREIGN KEY([ApplicationGroupId])
REFERENCES [dbo].[ApplicationGroups] ([Id])
GO

ALTER TABLE [dbo].[ApplicationProfilesFiles] CHECK CONSTRAINT [FK_ApplicationProfilesFiles_ApplicationGroupId_ApplicationGroups_Id]
GO

ALTER TABLE [dbo].[ApplicationProfilesFiles]  WITH CHECK ADD  CONSTRAINT [FK_ApplicationProfilesFiles_ApplicationProfileId_ApplicationProfiles_Id] FOREIGN KEY([ApplicationProfileId])
REFERENCES [dbo].[ApplicationProfiles] ([Id])
GO

ALTER TABLE [dbo].[ApplicationProfilesFiles] CHECK CONSTRAINT [FK_ApplicationProfilesFiles_ApplicationProfileId_ApplicationProfiles_Id]
GO




CREATE TABLE [dbo].[DevicesGroups](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[PricePerHour] money NOT NULL,
	[ApplicationProfileId] uniqueidentifier NOT NULL
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

GO

ALTER TABLE [dbo].[DevicesGroups]  WITH CHECK ADD  CONSTRAINT [FK_DevicesGroups_ApplicationProfileId_ApplicationProfiles_Id] FOREIGN KEY([ApplicationProfileId])
REFERENCES [dbo].[ApplicationProfiles] ([Id])
GO

ALTER TABLE [dbo].[DevicesGroups] CHECK CONSTRAINT [FK_DevicesGroups_ApplicationProfileId_ApplicationProfiles_Id]

GO

INSERT INTO [DevicesGroups]
([Id], [Name], [Description], [PricePerHour], [ApplicationProfileId]) VALUES
('E000F85C-06ED-4EF4-8C3A-FEDB89EA9EE4', 'Default', 'Default device group', 1, 'D5EF0DED-7944-45EE-9A5C-BEA68C274E89')


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