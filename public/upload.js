const uppy = new Uppy.Core()
    .use(Uppy.Dashboard, {
        target: "#uppy",
        inline: true,
        proudlyDisplayPoweredByUppy: false
    })
    .use(Uppy.Tus, {
        endpoint: "/files/",
        resume: true
    });



uppy.on("complete", () => {
    loadFiles();
});
