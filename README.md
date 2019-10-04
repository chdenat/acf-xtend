# acf-xtend
Some acf extensions (JS/PHP)

Version 0.5

##Introduction
With acf-xtend, we can manage ACF Field groups, field hierarchy and direct access to repeater children, but the initial goal was the possibility to reuse the selection the selection the user did on a fields in another field.

We create containers attached to some fields (a container contains the field content) and, on other fields it is possible to select only data from a container or all other that are not in a container.

##The Use case

### Genesis
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
 
### How can I do that ?

The idea behind is to manage field virtual containers where xtend push or pull fields keys. Those fields are settable through ACF field additionnal classes.


**PHP code**

/!\ **It works only with post fields ... !!!!**

Use this code or similar to use xtend in your post/page or Custom post typ admin pages.  

    add_action( 'acf/input/admin_enqueue_scripts', 'acf_xtend_enqueue_scripts' );
    function acf_xtend_enqueue_scripts() {
        $xtend_classes=[
            'push'=> 'push',
            'include' => 'pull',
            'exclude'=> 'notin'
        ];
        wp_register_script( 'acf-extend-js', esc_url( plugins_url( '/acf-xtend/xtend.js', __FILE__ )), false, false, true );
        wp_enqueue_script( 'acf-extend-js' );
        wp_localize_script( 'acf-extend-js', 'acf_xtend_classes', $xtend_classes );
        
        // You need also another js file, here it is "acf-admin-utils.js" where you put all your JS code related to acf 
        
        wp_register_script( 'acf-admin-utils-js', $directory . '../assets/js/acf-admin-utils.js', false, false, true );
	       wp_enqueue_script( 'acf-admin-utils-js' );
    }

**Settings in ACF**

In the ACF field definition and settings, you should add some custom classes to use **xtend containers**.

For a container named `mycontainer`

- If you want to push a post field content to a container :  add the class `push_mycontainer`
- If you want to restrict choices of a post field content to a container :  add the class `pull_mycontainer`
- If you want to retricts choices for some values that are not in a container :  add the class `notin_mycontainer`
Of course you can mix classes to get choices from a container and push it in  another container : `push_newcontainer pull_mycontainer`

Class names prefixes can be changed through PHP code above if you already use such classname.

**Settings in JavaScript**

In the "acf-admin-utils.js" (or any js file you enqueued) , add 
       
           acf.xtend.initialize('any-name');
where *any-name* is an acf model name (you can reuse one you created to manage acf data or use any word/string.

**And it's all** !!! the acf javascript library + xtend and sometimes select2 JS calls do the rest !!!

  
 
 
 

