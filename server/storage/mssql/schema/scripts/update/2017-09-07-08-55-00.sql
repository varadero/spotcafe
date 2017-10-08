CREATE TABLE [dbo].[ClientDevices](
	[Id] [nvarchar](100) NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Address] [nvarchar](250) NULL,
	[Description] [nvarchar](max) NULL,
	[Approved] [bit] NOT NULL,
	[ApprovedAt] decimal(16,0) NULL
 CONSTRAINT [PK_ClientDevices_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('E6508163-0FBA-4EAB-BCC7-2B2984318503', 'Client devices - View', 'Can view Client devices')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('DB936DD5-0CEB-4BFA-98FE-344F68484BE7', 'Client devices - Modify', 'Can modify Client devices')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('E6508163-0FBA-4EAB-BCC7-2B2984318503','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('DB936DD5-0CEB-4BFA-98FE-344F68484BE7','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-09-07 08:55:00' WHERE [Name]='database.version'