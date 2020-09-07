drop database message;
create database message;
use message;

CREATE TABLE account (
    username nvarchar(40),
    pass NVARCHAR(100)
   
) ENGINE = InnoDB;

CREATE TABLE allmessage (
    username nvarchar(40),
    textmess NVARCHAR(100)
) ENGINE = InnoDB;
 
select * from allmessage;

select * from account;
