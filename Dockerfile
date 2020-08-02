# start from the jupyter image with R, Python, and Scala (Apache Toree) kernels pre-installed
FROM jupyter/all-spark-notebook

USER root

RUN apt-get update && apt-get install -y gnupg2 \ 
    && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \ 
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt update && apt install yarn -y \
    && yarn global add lerna nodemon serve


RUN wget https://golang.org/dl/go1.14.6.linux-amd64.tar.gz \
    && tar -xvf go1.14.6.linux-amd64.tar.gz \
    && mv go /usr/local   

ENV PATH $PATH:/usr/local/go/bin

USER jovyan 

WORKDIR /home/jovyan

# Install exeternal deps
RUN git clone https://github.com/Bayesnote/Bayesnote.git \
    && cd ~/Bayesnote && lerna bootstrap \
    && cd ~/Bayesnote/flow && go get ./... 

# Build
RUN cd ~/Bayesnote/packages/common && yarn run build \
    && export NODE_OPTIONS=--max-old-space-size=8192 \
    && cd ~/Bayesnote/packages/browser && yarn && yarn run build\
    && cd ~/Bayesnote/packages/node && yarn && yarn run build 

EXPOSE 5000 8088 8890

CMD ["sh", "/home/jovyan/Bayesnote/start.sh"]
