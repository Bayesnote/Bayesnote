# start from the jupyter image with R, Python, and Scala (Apache Toree) kernels pre-installed
FROM jupyter/base-notebook

ARG prod=false

USER root

RUN apt-get update && apt-get install -y gnupg2 curl git build-essential\ 
    && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \ 
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update && apt install yarn -y \
    && yarn global add lerna nodemon serve \
    && rm -rf /var/lib/apt/lists/* \
    && wget https://golang.org/dl/go1.14.6.linux-amd64.tar.gz \
    && tar -xvf go1.14.6.linux-amd64.tar.gz \
    && mv go /usr/local 

ENV PATH $PATH:/usr/local/go/bin
ENV NODE_OPTIONS --max-old-space-size=8192

USER jovyan 

WORKDIR /home/jovyan

RUN conda install requests-kerberos -y \
    && pip install sparkmagic \
    && jupyter nbextension enable --py --sys-prefix widgetsnbextension \
    && jupyter-kernelspec install --user $(pip show sparkmagic | grep Location | cut -d" " -f2)/sparkmagic/kernels/sparkkernel \
    && jupyter-kernelspec install --user $(pip show sparkmagic | grep Location | cut -d" " -f2)/sparkmagic/kernels/pysparkkernel \
    && jupyter-kernelspec install --user $(pip show sparkmagic | grep Location | cut -d" " -f2)/sparkmagic/kernels/sparkrkernel \
    && mkdir -p .sparkmagic \
    && mkdir -p .bayesnote

COPY --chown=1000:100 config.json .sparkmagic/config.json

# Build Bayesnote for production
RUN if [ "$prod" = "true" ]; then \
    git clone https://github.com/Bayesnote/Bayesnote.git \
    && cd ~/Bayesnote && lerna bootstrap \
    && cd ~/Bayesnote/flow && go get ./... \
    && cd ~/Bayesnote/packages/common && yarn run build \
    && cd ~/Bayesnote/packages/browser && yarn && yarn run build\
    && cd ~/Bayesnote/packages/node && yarn && yarn run build; fi 

EXPOSE 5000 9292 8890

# CMD ["sh", "/home/jovyan/Bayesnote/start.sh"]
CMD ["tail", "-f", "/dev"]