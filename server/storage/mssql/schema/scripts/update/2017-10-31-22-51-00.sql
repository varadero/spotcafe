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

UPDATE [Settings] SET [Value]='2017-10-31 22:51:00' WHERE [Name]='database.version'