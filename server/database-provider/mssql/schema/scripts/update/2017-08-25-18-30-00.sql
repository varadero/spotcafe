CREATE TABLE [dbo].[Permissions](
	[Id] [uniqueidentifier] NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
 CONSTRAINT [PK_Permissions_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('E0E615C4-8727-41D3-BE61-682CC765D2D8', 'Employees - View', 'Can view employees')

INSERT INTO [Permissions]
([Id], [Name], [Description]) VALUES
('C2986027-3D76-4455-81EC-DB93D9327710', 'Employees - Modify', 'Can modify employees')

UPDATE [Settings] SET [Value]='2017-08-25 18:30:00' WHERE [Name]='database.version'