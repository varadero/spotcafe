CREATE TABLE [dbo].[Employees](
	[Id] [uniqueidentifier] NOT NULL,
	[Username] [nvarchar](250) NOT NULL,
	[Password] [nvarchar](250) NOT NULL,
	[Disabled] [bit] NOT NULL,
 CONSTRAINT [PK_Employees_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

INSERT INTO [dbo].[Employees]
([Id], [Username], [Password], [Disabled]) VALUES
('AD0CA48F-E266-48EA-BFB7-0C03147E442C', 'administrator', '', 0)

CREATE TABLE [dbo].[Roles](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
 CONSTRAINT [PK_Roles_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

INSERT INTO [dbo].[Roles]
([Id], [Name], [Description]) VALUES
('D2595A95-630C-4E66-9B2E-1F804154FDF5', 'Administrator', 'Gives full access to the system')

CREATE TABLE [dbo].[EmployeesInRoles](
	[EmployeeId] [uniqueidentifier] NOT NULL,
	[RoleId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_EmployeesInRoles_EmployeeId_RoleId] PRIMARY KEY CLUSTERED 
(
	[EmployeeId] ASC,
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

ALTER TABLE [dbo].[EmployeesInRoles]  WITH CHECK ADD  CONSTRAINT [FK_EmployeesInRoles_Employees] FOREIGN KEY([EmployeeId])
REFERENCES [dbo].[Employees] ([Id])

ALTER TABLE [dbo].[EmployeesInRoles] CHECK CONSTRAINT [FK_EmployeesInRoles_Employees]

ALTER TABLE [dbo].[EmployeesInRoles]  WITH CHECK ADD  CONSTRAINT [FK_EmployeesInRoles_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([Id])

ALTER TABLE [dbo].[EmployeesInRoles] CHECK CONSTRAINT [FK_EmployeesInRoles_Roles]

CREATE TABLE [dbo].[PermissionsInRoles](
	[PermissionId] [uniqueidentifier] NOT NULL,
	[RoleId] [uniqueidentifier] NOT NULL,
 CONSTRAINT [PK_PermissionsInRoles_PermissionId_RoleId] PRIMARY KEY CLUSTERED 
(
	[PermissionId] ASC,
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

ALTER TABLE [dbo].[PermissionsInRoles]  WITH CHECK ADD  CONSTRAINT [FK_PermissionsInRoles_Permissions] FOREIGN KEY([PermissionId])
REFERENCES [dbo].[Permissions] ([Id])

ALTER TABLE [dbo].[PermissionsInRoles] CHECK CONSTRAINT [FK_PermissionsInRoles_Permissions]

ALTER TABLE [dbo].[PermissionsInRoles]  WITH CHECK ADD  CONSTRAINT [FK_PermissionsInRoles_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([Id])

ALTER TABLE [dbo].[PermissionsInRoles] CHECK CONSTRAINT [FK_PermissionsInRoles_Roles]

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('E0E615C4-8727-41D3-BE61-682CC765D2D8','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('C2986027-3D76-4455-81EC-DB93D9327710','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[EmployeesInRoles]
([EmployeeId], [RoleId]) VALUES
('AD0CA48F-E266-48EA-BFB7-0C03147E442C', 'D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [DatabaseSettings] SET [Value]='2017-08-29 10:10:00' WHERE [Name]='database.version'