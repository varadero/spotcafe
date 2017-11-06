INSERT INTO [Settings]
([Name], [Value], [IsSystem]) VALUES
('clientDevice.restartAfterIdleFor', '120', 0)

INSERT INTO [Settings]
([Name], [Value], [IsSystem]) VALUES
('clientDevice.shutdownAfterIdleFor', '0', 0)

UPDATE [Settings] SET [Value]='2017-11-05 15:22:00' WHERE [Name]='database.version'