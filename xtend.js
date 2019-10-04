(function ($, undefined) {

    /******************************************************************
     *
     * ACF xtend
     *
     * Version : 0.5.1
     * Author : christian.denat@orange.fr
     *
     * Based on ACF and Select2 APIs
     *
     * This library allows :
     *
     * Management of ACF Group fields
     * Synchronization of field content : we can create containers and used them to filter field content (include/exclude)
     *
     */

    acf.xtend = {

        /**
         * Check if there are some items  that are useable by xtend
         *
         * @since 0.1
         *
         * @returns {boolean}
         */

        /**
         * by default
         */
        use: true,

        usable:
            () => {
                return (acf.xtend.use);
            },

        useContainers:
            () => {
                return (
                    acf.xtend.usable && (
                        $('[xtend-push]').length
                        + $('[xtend-include]').length
                        + $('[xtend-exclude]').length) > 0
                );
            },

        /**
         * Field Group
         */
        FieldGroup: acf.Field.extend({
            type: 'group',
        }),

        /**
         *  Get Field Group : return  a Group field plus all children
         *
         *  @since 0.1
         *
         * @param arg (jQuery element or group field key
         *
         * @returns {Object|boolean}
         */
        getFieldGroup: (arg) => {

            if (arg === undefined) {
                return false;
            }

            let key, $el;

            // check arg
            if (arg instanceof jQuery) {
                //got a jQuery element
                if (arg.attr('id').match(/acf-group_/)) {
                    $el = arg;
                    key = $el.attr('id').split('acf-')[1];
                } else {
                    return false;
                }
            } else {
                // got a key
                key = 'group_' + arg;
                //group= acf.getField(arg);
                $el = $('div[id="acf-group_' + arg + '"]')
            }
            let group = new acf.xtend.FieldGroup();
            group.$el = $el;
            group.set('key', key);
            group.$el.attr('data-key', key);
            group.set('type', 'group');
            group.$el.attr('data-type', 'group');

            group.set('children', acf.xtend.setChildren(group, group, 'div.inside.acf-fields', 'group'));

            return group;
        },

        /**
         * Return all Filed Groups in the page
         *
         * @since 0.1
         *
         * @param args : can be a key or empty
         */
        getFieldGroups: (args) => {

            args = acf.parseArgs(args, {
                key: '',
            });

            let selector = ''
            let groups = [];

            // key
            if (args.key) {
                selector += 'div[id="acf-group_' + args.key + '"]';
            } else {
                selector += 'div[id^="acf-group_"]';
            }

            let $list = $(selector);
            $list.each(function () {
                groups.push(acf.xtend.getFieldGroup(($(this))));
            });

            return groups;
        },

        /**
         * Returns the full key according to the hierarchy (in repeater)
         *
         * @since 0.1
         *
         * @param field
         * @returns {*}
         */
        getFullKey: (field) => {
            return field.$input().attr('id');
        },

        /**
         * getFields wrapper, used to get fields by fkey.
         *
         * @since 0.1
         *
         * @param args
         * @returns {Array}
         */
        getFields: (args) => {
            // vars
            var selector = '.acf-field';
            var $fields = false;

            // args
            args = acf.parseArgs(args, {
                fkey: '',
            });

            // type
            if (args.fkey) {
                selector += '[data-fkey="' + args.fkey + '"]';
                $fields = $(selector);
            } else {
                $fields = acf.findFields($args);
            }

            // loop
            var fields = [];
            $fields.each(function () {
                var field = acf.getField($(this));
                fields.push(field);
            });
            return fields;
        },

        /**
         * Create a new model
         *
         * @since 0.1
         *
         * @param name : Model name. If not defined let's use cid as name.
         * @returns {acf.Model|acf.Model}
         */
        newModel:
            (name) => {

                let model = new acf.Model({

                    /**
                     * Events for fields that are marked push | include | exclude
                     */
                    events: {
                        'change [xtend-push]': "push",
                        'change [xtend-exclude]': "exclude",
                        'change [xtend-include]': "include",
                    },

                    /**
                     * push content to a container
                     *
                     * @since 0.1
                     *
                     * @param event
                     * @param $el
                     */
                    push: (event, $el) => {

                        if (acf.xtend.useContainers()) {
                            let field = acf.getField($el);
                            field.removeNotice();
                            field.select2.on('select2:unselecting', acf.xtend.checkBeforeRemove);
                            acf.xtend.containers.set(field);
                        }
                    },
                    /**
                     * Include content from a container
                     *
                     * @since 0.1
                     *
                     * @param event
                     * @param $el
                     */
                    include:
                        (event, $el) => {
                            if (acf.xtend.useContainers()) {
                                field = acf.getField($el);
                            }
                        },

                    /**
                     * Exclude from a container
                     *
                     * @since 0.1
                     *
                     * @param event
                     * @param $el
                     */
                    exclude: (event, $el) => {
                        if (acf.xtend.useContainers()) {
                            acf.xtend.containers.set(acf.getField($el));
                        }
                    },

                    /**
                     * ACF filter : used to modify the selection list, according to actions and containers
                     *
                     * @since 0.1
                     *
                     * @param json
                     * @param params
                     * @param instance
                     * @returns {*}
                     */
                    filterList:
                        (json, params, instance) => {


                            let field = instance.get('field');


                            if (acf.xtend.useContainers()) {
                                /**
                                 *  Managing containers
                                 */

                                let containers = field.get('containers');

                                if (containers !== undefined) {

                                    let xc = acf.xtend.containers;
                                    let actions = xc.settings.actions;
                                    let doublon = acf.xtend.containers.settings.doublon;

                                    let keys = xc.get(field);
                                    let list = [];

                                    if (keys) {
                                        Object.keys(containers).forEach((action) => {
                                            Object.keys(containers[action]).forEach((index) => {
                                                let container = containers[action][index];
                                                let containerValues = keys[action][container];
                                                switch (action) {
                                                    case actions.push : {
                                                        if (!doublon) {

                                                            // get ids from Json
                                                            let jsonIds = [];
                                                            json.results.forEach((item) => {
                                                                jsonIds.push(item.id);
                                                            });
                                                            // Set ids from containers
                                                            let containerIds = [];
                                                            containerValues.forEach((value) => {
                                                                containerIds.push(parseInt(value));
                                                            });
                                                            list = [];
                                                            jsonIds.diff(containerIds).forEach((item) => {
                                                                for (let input of json.results) {
                                                                    if (item === input.id) {
                                                                        list.push({
                                                                            id: item,
                                                                            text: input.text
                                                                        });
                                                                        break;
                                                                    }
                                                                }
                                                            });
                                                        }
                                                        break;
                                                    }
                                                    case actions.include : {
                                                        containerValues.forEach((value) => {
                                                            json.results.forEach((item) => {
                                                                if (item.id === parseInt(value) && (!list.some(obj => obj.id === item.id) && doublon === false)) {
                                                                    list.push({
                                                                        id: item.id,
                                                                        ext: item.text
                                                                    });
                                                                }
                                                            });
                                                        });
                                                        break;
                                                    }
                                                    case  actions.exclude  : {

                                                        // get ids from Json
                                                        let jsonIds = [];
                                                        json.results.forEach((item) => {
                                                            jsonIds.push(item.id);
                                                        });
                                                        // Set ids from containers
                                                        let containerIds = [];
                                                        containerValues.forEach((value) => {
                                                            containerIds.push(parseInt(value));
                                                        });

                                                        list = [];
                                                        jsonIds.diff(containerIds).forEach((item) => {
                                                            for (let input of json.results) {
                                                                if (item === input.id) {
                                                                    list.push({
                                                                        id: item,
                                                                        text: input.text
                                                                    });
                                                                    break;
                                                                }
                                                            }
                                                        })

                                                        break;
                                                    }
                                                }
                                            });

                                        });

                                    }

                                    if (list.length > 0) {
                                        json.results = list;
                                    } else {
                                        json.results = [];

                                    }
                                }
                            }

                            return json;
                        }
                });

                acf.xtend.setModelName(model, name);
                acf.xtend.model = model;


                return model;
            },

        /**
         * Define model name
         *
         * If no name is given, take acf cid
         *
         * @since 0.1
         *
         * @param model
         * @param name
         */
        setModelName:
            (model, name) => {

                if (name === undefined) {
                    name = model.cid;
                }
                model.name = name;
            },

        /**
         * Get model name
         *
         * @since 0.1
         *
         * @param model
         * @returns {*}
         */
        getModelName:
            (model) => {
                return model.name;
            }
        ,

        /**
         * Used to retrieve the repeater format
         *
         * @since 0.1
         *
         * @param field
         * @returns {*}
         */
        getRepeaterFormat:
            (field) => { //TODO getFormat et trier suivant le type
                let f = field.$el.find('div.acf-repeater').attr('class').split(' -');
                return f[f.length - 1]
            },

        /**
         * Set children and full key for any element (recursive)
         *
         * @since 0.1
         *
         * @param object
         * @param parent
         * @param selector
         * @param format
         * @returns {Array}
         */
        setChildren:
            (object, parent, selector, format) => {

                let $el;

                if (object instanceof jQuery) {
                    $el = object;
                } else {
                    $el = object.$el
                }

                if (selector) {
                    selector += ' > div.acf-field'
                } else {
                    selector = 'div.acf-field'

                    if (format === 'row') {
                        selector = 'td.acf-fields > ' + selector
                    } else if (format === 'table') {
                        selector = 'td.acf-field'
                    }
                }

                let fields = [];
                $el.find(selector).each(function () {
                    let field = acf.getField($(this));
                    if (field !== null) {
                        let children = [];

                        //console.log(' '.repeat(depth * 4) + depth + ' => cid:' + field.cid + ' nom:' + field.get('name') + ' type:' + field.get('type'));
                        //console.log(' '.repeat(depth * 4+6),field);

                        switch (field.get('type')) {
                            case 'repeater' :

                                (field.$el).find('tr[data-id]:not(.acf-clone)').each(function () {
                                    let f = acf.xtend.setChildren($(this), field, null, acf.xtend.getRepeaterFormat(field));
                                    f.forEach((ff) => {
                                        children.push(ff);
                                    });

                                });
                                break;
                            default : {
                                //
                            }
                        }

                        // add new variable
                        field.set('fkey', acf.xtend.getFullKey(field));
                        field.$el.attr('data-fkey', acf.xtend.getFullKey(field));
                        field.set('children', children);
                        fields.push(field);
                        field.$el.find('select').on('select2:unselecting', acf.xtend.unselect);

                    }
                });
                return fields;
            },

        /**
         * Adds ajx results filter
         *
         * @since 0.1
         *
         * @param model
         * @param filter
         */
        addSelect2_ajax_resultsFilter:
            (model, filter) => {
                acf.addFilter('select2_ajax_results', model.filterList);
                if (filter !== undefined) {
                    acf.addFilter('select2_ajax_results', filter);
                }
            },

        /**
         * Remove a specific field
         *
         * @since 0.1
         *
         * @param $el
         */
        removeElement:
            ($el) => {
                //TODO : suppress only the field without to launch a new init
                acf.xtend.initialize(acf.xtend.model);
            },

        /**
         * Add a specific field
         *
         * @since 0.1
         *
         * @param $el
         */
        appendElement:
            ($el) => {
                //TODO : add only the field without all init
                acf.xtend.initialize(acf.xtend.model);
            },

        /**
         * Initialisation of xtend environment
         *
         * @since 0.1
         *
         * @param modelName
         * @returns {null|*|acf.Model}
         */

        initialize:
            (modelName) => {

                // if not usable, we do nothing
                if (!acf.xtend.usable()) {
                    return null;
                }

                // Register group type
                acf.registerFieldType(acf.xtend.FieldGroup);

                // Create the model
                model = acf.xtend.newModel(modelName);

                // Define all data
                acf.xtend.getFieldGroups().forEach((group) => {
                    acf.xtend.groupSetup(group, model);
                });

                // add a filter on Select2
                acf.xtend.addSelect2_ajax_resultsFilter(model);

                return model;
            },

        /**
         * Set a group field
         *
         * @since 0.1
         *
         * @param group
         * @param model
         */
        groupSetup:
            (group, model) => {
                let family = group.get('children');
                if (family.length > 0) {
                    family.forEach((field) => {
                        acf.xtend.containers.initialize(field, model);
                    });
                }

            },
        /**
         * Check if we can remove a value from a field
         *
         * If a value is used in an include set, we can not remove it from the push set.
         *
         * @since 0.1
         *
         * @param event
         */
        checkBeforeRemove:
            (event) => {
                // which item ?
                item = event.params.args.data;

                // field is grandpa. of the selected target.
                field = acf.getField($(event.target).parent().parent());
                containers = field.get('containers')['push'];

                // Try to find if some fields are using those containers in include mode.
                // in this case we do not remove the field.
                containers.forEach((container) => {
                    let error = false,
                        text = '';
                    $('[xtend-include="' + container + '"]').each((i, f) => {
                        let values = acf.getField($(f)).val();
                        if (values !== null && values.includes(item.id)) {
                            error = true;
                            text += '<li><strong>"' + item.text + '"</strong> can not  be removed : used in Field <strong>"' + acf.xtend.tools._getLabel(acf.getField($(f))) + '"</strong>.</li>';
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    });
                    if (error) {
                        field.showNotice({
                            text: '<ul>' + text + '</ul>',
                            type: 'warning',  // warning, error, success
                            dismiss: true,  // allow notice to be dismissed
                        });
                        field.select2.$el.select2('close');

                    }
                });
                return;
            }

    }

    /******************************************************************
     *
     * ACF xtend Containers Object
     *
     */
    acf.xtend.containers = {
        /**
         * settings
         *
         * @since 0.1
         *
         */
        settings: {
            /**
             * Take doublon into account (true) or not when reading containers content (default : no)
             *
             * @since 0.1
             *
             */
            doublon: false,

            /******************************************************************
             *
             * ACF xtend actions
             *
             * @since 0.1
             *
             */
            actions: {
                include: 'xtend-include',
                exclude: 'xtend-exclude',
                push: 'xtend-push',
            },

            /**
             * classes to detect action when managing containers
             *
             * @since 0.1
             *
             */
            classes: {
                include: acf_xtend_classes.include,
                push: acf_xtend_classes.push,
                exclude: acf_xtend_classes.exclude,
            },

        },

        /**
         * List of containers
         *
         * @since 0.1
         *
         */

        list: [],

        /**
         * Initializes container that have a push action declared
         *
         * @since 0.1
         *
         * @param field
         * @param action
         */
        set:
            (field) => {

                let containers = field.get('containers');

                if (containers !== undefined) {
                    [acf.xtend.containers.settings.actions.push, acf.xtend.containers.settings.actions.exclude].forEach((action) => {
                        containers[action].forEach((container) => {
                            acf.xtend.tools._fixSelect(field);
                            let fkey = acf.xtend.getFullKey(field);
                            if (!acf.xtend.containers.list[container].includes(fkey)) {
                                acf.xtend.containers.list[container].push(fkey);
                            }
                        });
                    });
                }
            },

        /**
         * add : alias of set
         *
         * @since 0.1
         *
         * @param field
         */
        add:
            (field) => {
                this.set(field)
            },


        /**
         *
         * Returns all values from containers attached to the field.
         *
         * @since 0.1
         **
         * @param field
         * @returns {Array}
         */
        get:
            (field) => {
                let list = [];
                let actions = acf.xtend.containers.settings.actions;
                list[actions.include] = [];
                list[actions.exclude] = [];
                list[actions.push] = [];
                let containers = field.get('containers');

                if (containers !== undefined) {
                    [actions.include, actions.exclude, actions.push].forEach((action) => {
                        containers[action].forEach((container) => {
                            acf.xtend.containers.list [container].forEach((fkey) => {
                                let fs = acf.xtend.getFields({
                                    fkey: fkey
                                })[0];
                                if (fs !== undefined) {
                                    switch (fs.get('type')) {
                                        case 'post_object': {
                                            acf.xtend.tools._fixSelect(fs);
                                            break;
                                        }
                                        default : {

                                        }
                                    }
                                    if (list[action][container] === undefined) {
                                        list[action][container] = [];
                                    }
                                    let FieldValues = fs.val();
                                    if (FieldValues !== null) {
                                        if (typeof FieldValues !== 'object') {
                                            FieldValues = [FieldValues];
                                        }
                                        FieldValues.forEach((value) => {
                                            list[action][container].push(value);
                                        });
                                    }
                                }
                            });
                        });
                    });
                }

                return list;
            },


        /**
         * Container initialisation
         *
         * @since 0.1
         **
         * @param field
         */

        initialize:
            (field, model) => {

                if (field === undefined) return;

                if (field instanceof Array) {
                    field.forEach((f) => {
                        acf.xtend.containers.initialize(f, model);
                    });
                } else if (field.get('children').length > 0) {
                    field.get('children').forEach((f) => {
                        acf.xtend.containers.initialize(f, model);
                    });
                } else {
                    let settings = acf.xtend.containers.settings,
                        re = new RegExp("(" + settings.classes.push + "|" + settings.classes.include + "|" + settings.classes.exclude + ")-([a-z]+)", "gi"),
                        classes = field.$el.attr('class').match(re);

                    if (classes) {
                        let containers = [];
                        Object.keys(settings.classes).forEach((action) => {
                            containers[action] = [];
                        });
                        classes.forEach((classe) => {

                            // Extract action and container from class name : <action>-<container>

                            let list = classe.split('-'),
                                action = acf.xtend.tools._getAction(list[0]),
                                container = list[1];

                            if (acf.xtend.containers.list[container] === undefined) {
                                acf.xtend.containers.list[container] = [];
                            }
                            containers[action].push(container);
                            field.$el.attr('xtend-' + action, container);

                        });
                        field.set('containers', containers);
                    }

                    acf.xtend.containers.set(field);

                }
            },

    }

    /******************************************************************
     * ACF xtend Tools
     *
     * @since 0.1
     *
     */
    acf.xtend.tools = {

        /**
         * This function compare the content of the Select2 List managed by the user  and the Select content (managed by select2 or ACF)
         * and make synchronisation (when we remove a value, the select options are now sync.
         *
         * @since 0.1
         *
         * @param field : field
         */
        _fixSelect:
            (field) => {
                if (field.select2) {
                    let $old = field.$input().find('option');  // Select
                    let $current = field.$el.find('li.select2-selection__choice'); // Input

                    if ($current.size() === 0) {
                        $old.remove();
                    } else {
                        let old = [];
                        let current = []
                        $old.each((i, option) => {
                            old.push($(option).text());
                        });
                        $current.each((j, li) => {
                            let $li = $(li).text();
                            current.push($li.substring(1, $li.length)); // delete x
                        });
                        let difference = old.filter(x => !current.includes(x));
                        $old.each((i, option) => {
                            difference.forEach((value) => {
                                if ($(option).text() === value) {
                                    $(option).remove();
                                }
                            });
                        });
                    }
                }
            },

        /**
         * Retrieve the label of a field
         *
         * @since 0.1
         *
         * @param field
         * @returns {*}
         * @private
         */

        _getLabel: (field) => {
            return field.$el.find('.acf-label label').text();
        },
        /**
         * Retrieve the action assicated to a specific class
         *
         * @since 0.1
         *
         * @param classe
         * @returns {string}
         * @private
         */
        _getAction: (classe) => {
            return Object.keys(acf.xtend.containers.settings.classes).find(key => acf.xtend.containers.settings.classes[key] === classe);
        }
    }

    /**
     * Array diff utility
     *
     * @since 0.1
     *
     * @param a
     * @returns {Array|*[]}
     */
    Array.prototype.diff = function (a) {
        return this.filter(function (i) {
            return a.indexOf(i) === -1;
        });
    };

})(jQuery);
;
