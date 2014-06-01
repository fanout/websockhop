NAME = websockhop
VERSION = 0.1.0

all: dist

distclean:
	rm -f $(NAME)-$(VERSION).js $(NAME)-$(VERSION).min.js

clean:

dist: $(NAME)-$(VERSION).min.js

$(NAME)-$(VERSION).js: $(NAME).js
	cp $(NAME).js $(NAME)-$(VERSION).js

$(NAME)-$(VERSION).min.js: $(NAME)-$(VERSION).js
	sed -e "s/DEBUG = true/DEBUG = false/g" $(NAME)-$(VERSION).js | ./compile.py > $(NAME)-$(VERSION).min.js.tmp
	mv $(NAME)-$(VERSION).min.js.tmp $(NAME)-$(VERSION).min.js
