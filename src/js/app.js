
;(function(window){
    
    'use strict'

    function Event(sender) {
        this._sender = sender;
        this._listeners = [];
    };
    
    Event.prototype = {
        attach: function (listener) {
            this._listeners.push(listener);
        },
        notify: function (args) {
            var index;
    
            for (index = 0; index < this._listeners.length; index += 1) {
                this._listeners[index](this._sender, args);
            }
        }
    };

    function PlaylistModel(){
        this.mixes = {};
        this.playlist = [];

        this.itemsRetrieved = new Event(this);
        this.itemAdded = new Event(this);
        this.itemDeleted = new Event(this);
    };

    PlaylistModel.prototype = {
        makeAjaxCall: function (){
            var methodType = 'GET';
            var url = 'https://api.mixcloud.com/popular/';
            var promiseObj = new Promise(function(resolve, reject){
                var xhr = new XMLHttpRequest();
                xhr.open(methodType, url, true);
                xhr.send();
                xhr.onreadystatechange = function(){
                    if (xhr.readyState === 4){
                        if (xhr.status === 200){
                            var resp = xhr.responseText;
                            var respJson = JSON.parse(resp);
                            resolve(respJson);
                        } else {
                            reject(xhr.status);
                        }
                    } else {
                        console.log("xhr processing going on");
                    }
                }
            });
            return promiseObj;
        },
        getItems: function(){
            var storeItems = this.storeItems.bind(this);
            var promise = this.makeAjaxCall().then(function(data){
                storeItems(data);
            }, function() {
                console.log("Error occured");
            });
        },
        storeItems: function(data){
            this.mixes = data.data;
            this.itemsRetrieved.notify();
        },
        addItemToPlaylist: function(index){
            this.playlist.push(this.mixes[index]);
            this.itemAdded.notify();
        },
        delItemFromPlaylist: function(id){
            var index = id.slice(5);
            delete this.playlist[index];
            this.itemDeleted.notify(id);
        }    
    }

    function PlaylistView(model){
        var _ = this;

        this._model = model;  
        
        this.addButtonClicked = new Event(this);
        this.delButtonClicked = new Event(this);

        this.DOM = {
            albumCover: $('.albums__miniature img'),
            albumDate: '',
            albumTitle: '',
            addButton: '.albums__miniature a',
            songList: '',
            removeSongListButton: '',
            albumsContainer: '.albums .row',
            playlistContainer: '.sidebar__songs ul',
            deleteButton: '.deletePlaylist',
            searchInput: '.searchField',
        }
        this.Templates ={
            mixItem: '<div class="col-6 col-lg-4 albums__miniature" id="%id%"><img src="%pictures.large%"/><date>%updated_time%</date><h2>%name%</h2><p><span><i class="fa fa-play-circle-o" aria-hidden="true"></i> %play_count%</span><span>&nbsp&nbsp<i class="fa fa-heart selected" aria-hidden="true"> </i> %favorite_count%</span><span>&nbsp&nbsp<i class="fa fa-retweet" aria-hidden="true"></i>  %repost_count%</span></p><p><a class="btn btn-secondary btn-success" href="#" role="button">+ Dodaj do playlisty</a></p></div>',
            playlistItem: '<li id="play-%id%"><h3>%name%</h3><span>&nbsp&nbsp<i class="deletePlaylist fa fa-trash-o" aria-hidden="true"></i></span><span><a href="%url%" target="_blank"><i class="fa fa-play-circle-o" aria-hidden="true"></i></a> %play_count%</span></li>'
        }

        this._model.itemsRetrieved.attach(function(){
            _.renderElement(_.Templates.mixItem, _.DOM.albumsContainer, _._model.mixes, _.setAddListeners);
        });

        this._model.itemAdded.attach(function(){
            _.addMixToPlaylist();
        });

        this._model.itemDeleted.attach(function(sender, index){
            _.delMixFromPlaylist(index);
        });  
    };

    PlaylistView.prototype = {

        renderElement: function(template, container, data, callback){
            var updatedTemplate, 
                key,
                mapObject = {}, 
                namesToChange,
                mapRegExp,
                searchRegExp = new RegExp("[%]([^%])+[%]","g");

            namesToChange = template.match(searchRegExp).map(function(element){
                return element.replaceAll('%', '');
            });
            
            for(key in data){
                namesToChange.forEach(function(element){
                    var keyName = eval('data[' + key + "]." + element);
                    if(element == 'updated_time'){
                        mapObject['%'+element+'%'] = keyName.substr(0,10);
                    }   else{
                        mapObject['%'+element+'%'] = keyName;
                    }
                });
                mapObject['%id%'] = key;
                mapRegExp = new RegExp(Object.keys(mapObject).join("|"),"gi");
                updatedTemplate = template.replace(mapRegExp, function(matched){
                    return mapObject[matched.toLowerCase()];
                });
                document.querySelector(container).insertAdjacentHTML('beforeend', updatedTemplate);
            }
            if(callback){
                callback.call(this);
            }
        },

        addMixToPlaylist: function(){
            var selectedPlaylist = {};
            selectedPlaylist[this._model.playlist.length-1] = this._model.playlist[this._model.playlist.length-1];
            this.renderElement(this.Templates.playlistItem, this.DOM.playlistContainer, selectedPlaylist, this.setDelListeners);
        },

        delMixFromPlaylist: function(id){
            var element = document.getElementById(id).remove();
        },

        setAddListeners: function(){
            var addButtonClicked = this.addButtonClicked;
            Array.prototype.forEach.call(document.querySelectorAll(this.DOM.addButton),function(e){ 
                e.addEventListener('click',function(e){
                    addButtonClicked.notify(e);
            },false)});
            this.setSearchListeners();
        },

        setDelListeners: function(){
            var delButtonClicked = this.delButtonClicked;
            document.querySelectorAll(this.DOM.deleteButton)[document.querySelectorAll(this.DOM.deleteButton).length-1].addEventListener('click', function(e){
                delButtonClicked.notify(e);
            })
        },

        searchMixes: function(e){
            var input = document.querySelector(".searchField").value;
            if(input != ""){
                for(var i = 0; i < this._model.mixes.length; i++){
                    if(this._model.mixes[i].name.toLowerCase().indexOf(input.toLowerCase()) != -1){
                        document.getElementById(i).style.display = 'block';
                    } else {
                        document.getElementById(i).style.display = 'none';  
                    }                    
                }
            } else{
                for(var i = 0; i < this._model.mixes.length; i++){
                    document.getElementById(i).style.display = 'block';                   
                }
            }
        },

        setSearchListeners:function(){
            var searchMixes = this.searchMixes;
            var _ = this;
            document.querySelector(this.DOM.searchInput).addEventListener('input', function(e){
                searchMixes.call(_, e);
            });   
        }
    }

    function PlaylistController(model, view){
        this._model = model;
        this._view = view;

        var _ = this;

        this._view.addButtonClicked.attach(function(sender, arg){
            _.addItem(arg);
        });

        this._view.delButtonClicked.attach(function(sender, arg){
            _.delItem(arg);
        })
    }

    PlaylistController.prototype = {
        load: function(){
            this._model.getItems();
        },

        addItem: function(e){
            e.stopPropagation();
            e.preventDefault();
            var index = e.target.parentNode.parentNode.id
            this._model.addItemToPlaylist(index);
        },

        delItem: function(e){
            var id = e.target.parentNode.parentNode.id;
            this._model.delItemFromPlaylist(id);
        }
    }

    function init(){
        var model = new PlaylistModel(),
            view = new PlaylistView(model),
            controller =  new PlaylistController(model, view);
            controller.load();
            console.log("app started");
    }
    window.init = init;


})(window);


init();


