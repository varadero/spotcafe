CREATE TABLE [dbo].[ClientDevices](
	[Id] [nvarchar](100) NOT NULL,
	[Name] [nvarchar](250) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Approved] [bit] NOT NULL,
	[ApprovedAt] [int] NULL,
 CONSTRAINT [PK_ClientDevices_Id] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

UPDATE [Settings] SET [Value]='2017-09-07 08:55:00' WHERE [Name]='database.version'