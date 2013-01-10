{% include 'geonode/ext_header.html' %}
{% include 'geonode/salamati_header.html' %}
<script type="text/javascript">

// TODO this copies a lot of code from GeoExplorer
// and GeoNode-GeoExplorer.js
// need to find a more elegant way to do this
Ext.namespace("GeoNode.plugins");
GeoNode.plugins.Save = {

    metadataFormCancelText : "Cancel",
    metadataFormSaveAsCopyText : "Save as Copy",
    metadataFormSaveText : "Save",
    metaDataHeader: 'About this Map',
    metaDataMapAbstract: 'Abstract',
    metaDataMapTitle: 'Title',

    save: function(callback, scope) {
        var state = this.getState();
        // TODO find out where the circular reference is
        delete state.portalConfig;
        var configStr = Ext.util.JSON.encode(state);
        var method, url;
        if (this.id) {
            method = "PUT";
            url = this.rest + this.id + "/data";
        } else {
            method = "POST";
            url = this.rest + "new/data";
        }
        var requestConfig = {
            method: method,
            url: url,
            data: configStr
        };
        if (this.fireEvent("beforesave", requestConfig, callback) !== false) {
            OpenLayers.Request.issue(Ext.apply(requestConfig, {
                callback: function(request) {
                    this.handleSave(request);
                    if (callback) {
                        callback.call(scope || this);
                    }
                },
                scope: this
            }));
        }
    },

    /** private: method[handleSave]
     *  :arg: ``XMLHttpRequest``
     */
    handleSave: function(request) {
        if (request.status == 200) {
            var config = Ext.util.JSON.decode(request.responseText);
            var mapId = config.id;
            if (mapId) {
                this.id = mapId;
                this.fireEvent("save", this.id);
            }
        } else {
            if (window.console) {
                console.warn(this.saveErrorText + request.responseText);
            }
        }
    },

    /** private: method[initMetadataForm]
     *
     * Initialize metadata entry form.
     */
    initMetadataForm: function(callback){

        var titleField = new Ext.form.TextField({
            width: '95%',
            fieldLabel: this.metaDataMapTitle,
            value: this.about.title,
            allowBlank: false,
            enableKeyEvents: true,
            listeners: {
                "valid": function() {
                    saveAsButton.enable();
                    saveButton.enable();
                },
                "invalid": function() {
                    saveAsButton.disable();
                    saveButton.disable();
                }
            }
        });

        var abstractField = new Ext.form.TextArea({
            width: '95%',
            height: 200,
            fieldLabel: this.metaDataMapAbstract,
            value: this.about["abstract"]
        });

        var metaDataPanel = new Ext.FormPanel({
            bodyStyle: {padding: "5px"},
            labelAlign: "top",
            items: [
                titleField,
                abstractField
            ]
        });
        metaDataPanel.enable();
        var saveAsButton = new Ext.Button({
            text: this.metadataFormSaveAsCopyText,
            disabled: !this.about.title,
            handler: function(e){
                delete this.id;
                this.about.title = titleField.getValue();
                this.about["abstract"] = abstractField.getValue();
                this.metadataForm.hide();
                this._doSave = true;
                this.save(this.metadataForm.saveCallback);
            },
            scope: this
        });
        var saveButton = new Ext.Button({
            text: this.metadataFormSaveText,
            disabled: !this.about.title,
            handler: function(e){
                this.about.title = titleField.getValue();
                this.about["abstract"] = abstractField.getValue();
                this.metadataForm.hide();
                this._doSave = true;
                this.save(this.metadataForm.saveCallback);
            },
            scope: this
        });

        this.metadataForm = new Ext.Window({
            title: this.metaDataHeader,
            closeAction: 'hide',
            saveCallback: callback,
            items: metaDataPanel,
            modal: true,
            width: 400,
            autoHeight: true,
            bbar: [
                "->",
                saveAsButton,
                saveButton,
                new Ext.Button({
                    text: this.metadataFormCancelText,
                    handler: function() {
                        titleField.setValue(this.about.title);
                        abstractField.setValue(this.about["abstract"]);
                        this.metadataForm.hide();
                    },
                    scope: this
                })
            ]
        });
    },

    /** private: method[showMetadataForm]
     *  Shows the window with a metadata form
     */
    showMetadataForm: function(callback) {
        if(!this.metadataForm) {
            this.initMetadataForm(callback);
        } else {
            this.metadataForm.saveCallback = callback;
        }
        this.metadataForm.show();
    }

};

var app;
Ext.onReady(function() {
{% autoescape off %}
    var config = Ext.apply({
        authStatus: {% if user.is_authenticated %} 200{% else %} 401{% endif %},
        proxy: "/proxy/?url=",
        printService: "{{GEOSERVER_BASE_URL}}pdf/",
        portalConfig: {
            items: [{
                xtype: "container",
                layout: "fit",
                height: 81,
                region: "north"
            }]
        },
        /* The URL to a REST map configuration service.  This service 
         * provides listing and, with an authenticated user, saving of 
         * maps on the server for sharing and editing.
         */
        tools: [{
            actions: [{
                xtype: 'button',
                text: 'Save',
                handler: function() { 
                    app.doAuthorized(["ROLE_ADMINISTRATOR"], function() {
                        app.showMetadataForm();
                    }, this);
                }
            }]
        }],
        rest: "{% url maps_browse %}",
        homeUrl: "{% url home %}",
        localGeoServerBaseUrl: "{{ GEOSERVER_BASE_URL }}",
        localCSWBaseUrl: "{{ CATALOGUE_BASE_URL }}",
        csrfToken: "{{ csrf_token }}"
    }, {{ config }});

    Ext.override(salamati.Viewer, GeoNode.plugins.Save);
    app = new salamati.Viewer(config);
{% endautoescape %}
});
</script>
