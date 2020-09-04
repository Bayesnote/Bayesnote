FROM jupyter/base-notebook

USER root

RUN apt-get update && apt-get install openssh-server -y && echo "root:z" | chpasswd && sed -i 's/#*PermitRootLogin without-password/PermitRootLogin yes/g' /etc/ssh/sshd_config && service ssh start

EXPOSE 22 8888

USER jovyan