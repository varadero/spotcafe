CREATE TABLE dbo.Permissions
	(
	Id uniqueidentifier NOT NULL,
	Name nvarchar(250) NOT NULL,
	Description nvarchar(MAX) NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]

ALTER TABLE dbo.Permissions ADD CONSTRAINT
	PK_Permissions_Id PRIMARY KEY CLUSTERED 
	(
	Id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]


CREATE UNIQUE NONCLUSTERED INDEX IX_Permissions_Name ON dbo.Permissions
	(
	Name
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

INSERT INTO [Permissions]
([Id], [Name], [Description])
VALUES ('E0E615C4-8727-41D3-BE61-682CC765D2D8', 'Employees - View', 'Can view employees')

INSERT INTO [Permissions]
([Id], [Name], [Description])
VALUES ('C2986027-3D76-4455-81EC-DB93D9327710', 'Employees - Modify', 'Can modify employees')

UPDATE DatabaseSettings SET Value='2017-08-25 18:30:00' WHERE Name='DatabaseVersion'