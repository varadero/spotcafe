ALTER TABLE dbo.Settings ADD
	[IsSystem] bit NULL

GO

UPDATE [Settings]
SET [IsSystem]=1
WHERE [Name] IN ('client.files', 'database.version', 'token.secret')

GO

UPDATE [Settings]
SET [IsSystem]=0
WHERE [IsSystem] IS NULL

GO

ALTER TABLE [Settings]
ALTER COLUMN [IsSystem] bit NOT NULL

GO

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('593942DD-8A91-45DE-A8EC-03D4EAEF5B29', 'Advanced settings - View', 'Can view advanced settings')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('484ADCE0-85EA-4498-99FC-0537DB8C5BBB', 'Advanced settings - Modify', 'Can modify advanced settings')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('593942DD-8A91-45DE-A8EC-03D4EAEF5B29','D2595A95-630C-4E66-9B2E-1F804154FDF5')

INSERT INTO [dbo].[PermissionsInRoles]
([PermissionId], [RoleId]) VALUES
('484ADCE0-85EA-4498-99FC-0537DB8C5BBB','D2595A95-630C-4E66-9B2E-1F804154FDF5')

UPDATE [Settings] SET [Value]='2017-11-05 13:30:00' WHERE [Name]='database.version'