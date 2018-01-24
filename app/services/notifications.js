import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default Service.extend({
    flashMessages: service(),
    session: service(),
    routing: service('-routing'),
    
    socket: null,
    charId: null,
    
    socketUrl() {
        return `ws://${aresconfig.host}:${aresconfig.port}/websocket`;
    },
    
    checkSession(charId) {
        let socket = this.get('socket');
        if (!socket || this.get('charId') != charId) {
            this.sessionStarted(charId);
        }
    },
    
    sessionStarted(charId) {
        let socket = this.get('socket');
        this.set('charId', charId);
        
        if (socket) {
            socket.close();
        }
        
        socket = new WebSocket(this.socketUrl());
        this.set('socket', socket);
        let self = this;
        socket.onopen = function() {
            self.handleConnect(self);
        };
        socket.onmessage = function(evt) {
            self.handleMessage(self, evt);
        };
    },
    
    sessionStopped() {
        let socket = this.get('socket');
        this.set('charId', null);
        if (socket) {
            socket.close();
            this.set('socket', null);
        }
    },
    
    handleConnect(self) {
        let cmd = {
          'type': 'identify',
          'data': { 'id': self.get('charId') }
        };
        let json = JSON.stringify(cmd);
        return self.get('socket').send(json);
    },
    
    handleMessage(self, evt) {
        
        var data;
        
        try
        {
           data = JSON.parse(evt.data);
        }
        catch(e)
        {
            data = null;
        }
        
        if (!data) {
            return;
        }
        
        var recipient = data.args.character;

        if (!recipient || recipient === self.get('charId')) {
            var formatted_msg = ansi_up.ansi_to_html(data.args.message, { use_classes: true });
            alertify.notify(formatted_msg, 'success', 10);
            
            if (data.args.notification_type == "new_mail") {
                var mail_badge = $('#mailBadge');
                var mail_count = mail_badge.text();
                mail_count = parseInt( mail_count );
                mail_badge.text(mail_count + 1);
            }
        }
        
    }
    
    
});