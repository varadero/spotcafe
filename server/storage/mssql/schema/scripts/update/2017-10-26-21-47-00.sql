INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('48A51FF2-7D94-4F8C-ACC3-4D828A956154', 'Clients - Add credit', 'Can add credit to clients')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('48A51FF2-7D94-4F8C-ACC3-4D828A956154','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-10-26 21:47:00' WHERE [Name]='database.version'