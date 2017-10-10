INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('2745ED16-1FCD-4F4A-B1D3-AC4916E5D7E7', 'Clients - View', 'Can view clients')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('D2DD76AE-1403-46E9-881E-F6048ABD8410', 'Clients - Modify', 'Can modify clients')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('2745ED16-1FCD-4F4A-B1D3-AC4916E5D7E7','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('D2DD76AE-1403-46E9-881E-F6048ABD8410','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-10-10 23:51:00' WHERE [Name]='database.version'