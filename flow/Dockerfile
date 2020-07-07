# start from the jupyter image with R, Python, and Scala (Apache Toree) kernels pre-installed
FROM jupyter/all-spark-notebook

RUN npm install -g @bayesnote/node \
    npm install -g @bayesnote/browser \
    npm install -g serve \
    #TODO: remove the following:
    npm install -g nodemon 

# for frontend app
EXPOSE 5000 8890

CMD ["sh", "/opt/conda/lib/node_modules/@bayesnote/node/start.sh"]