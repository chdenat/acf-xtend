# acf-xtend
Some acf extensions (JS/PHP)

Version 0.5

##Introduction
With acf-xtend, we can manage ACF Field groups, field hierarchy and direct access to repeater children, but the initial goal was the possibility to reuse the selection the selection the user did on a fields in another field.

We create containers attached to some fields (a container contains the field content) and, on other fields it is possible to select only data from a container or all other that are not in a container.

##The Use case## 

###Genesis###
Originally, I developed this tool to manage a pro soccer team season week after week. 

We have a Player CPT used to manage all players in player group: Player A, Player B, Player C ... Player N

Each week the team manager selects 18 players from the player group. for all other players, we need to manage injuries, National selections or players who will play in the B team.
 Then, the game day,  we select only 11 players to start the match, from the initial 18 players group.
 
So I have a container some fields :
 - 18_group
 - injured
 - nat_selection
 - team_b
 - 11_team
 
 In **injured**, **nat_selection** and **team_b** fields, I can add players that are not in **18_group**, but only once (an injured player cannot play .. in national selection nor in team_B ...).
 In **11_team**, all the players I'll select must be in **18_group**
 
###How can I do that ?###

My **18_group** field is the reference and I attach the container ***group*** by adding a class **xtend-push_group**.
For  **injured**, **nat_selection** and **team_b** fields, I add the class **xtend-exclude-group** and for the 11_team, i just add **xtend-include-groupe**. 

**And it's all** !!! the acf javascript library + xtend and sometimes select2 JS calls do the rest !!!

  
 
 
 

