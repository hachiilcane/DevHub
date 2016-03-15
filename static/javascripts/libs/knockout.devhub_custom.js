ko.bindingHandlers.decoBlogHtml = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    return { 'controlsDescendantBindings': true };
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).showDecora(ko.unwrap(valueAccessor()));
  }
}

ko.bindingHandlers.decoBlogTitleHtml = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    return { 'controlsDescendantBindings': true };
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).html(ko.unwrap(valueAccessor()));
    emojify.run(element);
    ko.applyBindingsToDescendants(bindingContext, element);
  }
}

ko.bindingHandlers.decoHtml = {
  init: function() {
    return { 'controlsDescendantBindings': true };
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).showDecora(ko.unwrap(valueAccessor()));
    ko.applyBindingsToDescendants(bindingContext, element);
  }
};

ko.bindingHandlers.decoMemoTitle = {
  init: function() {
    return { 'controlsDescendantBindings': true };
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).html(ko.unwrap(valueAccessor()));
    emojify.run(element);
    ko.applyBindingsToDescendants(bindingContext, element);
  }
};

ko.bindingHandlers.decoMemoIndex = {
  init: function() {
    return { 'controlsDescendantBindings': true };
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).html(ko.unwrap(valueAccessor()));
    emojify.run(element);
  }
};

ko.bindingHandlers.decoHtmlMsg = {
  init: function() {
    return { 'controlsDescendantBindings': true };
  },
  update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).html(valueAccessor());
    ko.applyBindingsToDescendants(bindingContext, element);
  }
}

ko.bindingHandlers.tooltip = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    $(element).tooltip({placement: valueAccessor()});
  }
}

ko.bindingHandlers.editStartTextarea = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
  },
  update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    var value = valueAccessor();
    var valueUnwrapped = ko.unwrap(value);

    if (valueUnwrapped == true){
      $(element).caretLine(0);
      $(element).autofit({min_height: 100});
    }
  }
}

// autofit カスタムバインディング(true の場合に有効)
ko.bindingHandlers.autofit = {
  init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
    if (valueAccessor()){
      $(element).autofit({min_height: 700});
    }
  }
}


