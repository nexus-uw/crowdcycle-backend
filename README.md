CrowdCycle Backend
==============

Purpose
------
First and foremost, the purpose of this repo is  to provide a backend service for the [iOS app](https://github.com/jayanth1991/crowdcycle-iOS). The goal of CrowdCycle is to eventually provide a single access point for cyclists to find out the current cycling conditions of an urban area. Current mapping services rely too heavily on car centric maps and what the local government thinks the cycling routes are. But the real world situation may differ radically. Pot-hole ridden roads appear the same as brand-new roads. Streetcar tracks are not drawn. Areas with lots of pedestrians to watch out for can only be determined by scanning a
map for patterns that are learned through experience. And so on and on.

This project is not intended for actual use in its current state, but more as an example of what a crowd sourced mapping application for cyclists could be. Most of the ideas and concepts were developed with a heavy bias towards biking in
Toronto, Canada.

Requirements
------------
### Herkou Requirements
- an account on Herkou
- the Heroku Toolbelt 
- a Postgres db add-on
- a Pusher add-on

### Required Environment Variables
- PusherAppId
- PusherKey
- PusherSecret
- DATABASE_URL (Heroku auto-defined)
- PORT (Heroku auto-defined)

Pre-Opensource Contributors
----------------------------
-Jayanth Kottapalli

-Daniel MacKenzie

-Yanwei Xiao
