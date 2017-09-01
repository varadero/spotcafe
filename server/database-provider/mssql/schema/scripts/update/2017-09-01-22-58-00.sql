INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('2EF7486A-549C-4A8C-8E7C-BA75BD8827A8', 'Employees - Modify own acount', 'Can modify own employee account')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('2EF7486A-549C-4A8C-8E7C-BA75BD8827A8','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [DatabaseSettings] SET [Value]='2017-09-01 22:58:00' WHERE [Name]='database.version'
