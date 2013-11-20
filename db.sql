--for dev: sudo apt-get install postgresql-contrib
--CREATE EXTENSION "uuid-ossp";


Create TYPE markerType AS ENUM ('pointOfIntrest', 'physicalHazard', 'peopleHazard','caution');
Create TYPE zoneType AS ENUM ('circle','box');


drop table MARKERS;

create table MARKERS (
UID uuid PRIMARY KEY ,
POINT point NOT NULL,
MARKERTYPE markerType,
CREATED timestamp NOT NULL,
MODIFIED timestamp,
OWNERID uuid,
UPVOTES integer,
DOWNVOTES integer,
TITLE varchar(50),
DESCRIPTION varchar(500)
);

create table VOTES(
UID uuid primary key,
MARKERID uuid NOT NULL,
USERID uuid NOT NULL,
vote integer
);

create table USERS(
UID uuid primary key,
UNAME varchar(50),
PSWD varchar(25),
JOINED timestamp,
EMAIL varchar(60));

create table COMMENTS(
UID uuid primary key,
TEXT varchar(500),
CREATORID uuid,
CREATED timestamp,
MARKERID uuid);

create table CIRCLESUBZONES(
UID uuid primary key,
SUBID uuid,
CIRCLE circle
);

create table BOXSUBZONES(
UID uuid primary key,
SUBID uuid,
BOX box
);

create table SUBSCRIPTIONS(
UID uuid primary key,
USERID uuid,
DEVICEID varchar(100),
TYPES varchar(100),
ZONETYPE zoneType,
ZONEID uuid
);

