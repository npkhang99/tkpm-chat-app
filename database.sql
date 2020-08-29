drop database message;
create database message;
use message;

CREATE TABLE allmessage (
    username nvarchar(40),
    textmess NVARCHAR(100)
    
) ENGINE = InnoDB;
 
select * from allmessage;