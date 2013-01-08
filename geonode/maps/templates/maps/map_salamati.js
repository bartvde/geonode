{% include 'geonode/ext_header.html' %}
{% include 'geonode/salamati_header.html' %}
<script type="text/javascript">
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
        rest: "{% url maps_browse %}",
        homeUrl: "{% url home %}",
        localGeoServerBaseUrl: "{{ GEOSERVER_BASE_URL }}",
        localCSWBaseUrl: "{{ CATALOGUE_BASE_URL }}",
        csrfToken: "{{ csrf_token }}"
    }, {{ config }});

    app = new salamati.Viewer(config);
{% endautoescape %}
});
</script>
