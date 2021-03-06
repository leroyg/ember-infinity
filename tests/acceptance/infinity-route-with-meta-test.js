import Ember from 'ember';
import { module, test } from 'qunit';
import startApp from '../helpers/start-app';
import Pretender from 'pretender';

var App, server;

var posts = [
  { id: 1, name: "Squarepusher", category: "a" },
  { id: 2, name: "Aphex Twin", category: "b" },
  { id: 3, name: "Universal Indicator", category: "a" },
  { id: 4, name: "Mike & Rich", category: "b" },
  { id: 5, name: "Alroy Road Tracks", category: "a" },
  { id: 6, name: "AFX", category: "b" }
];

module('Acceptance: Infinity Route', {
  setup: function() {
    App = startApp();
    server = new Pretender(function() {
      this.get('/posts', function(request) {
        var body, subset, perPage, startPage, offset;

        if (request.queryParams.category) {
          subset = posts.filter(function(post) {
            return post.category === request.queryParams.category;
          });
        } else {
          subset = posts;
        }
        perPage = parseInt(request.queryParams.per_page);
        startPage = parseInt(request.queryParams.page);

        var pageCount = Math.ceil(subset.length / perPage);
        offset = perPage * (startPage - 1);
        subset = subset.slice(offset, offset + perPage);

        body = { posts: subset, meta: { total_pages: pageCount } };

        return [200, {"Content-Type": "application/json"}, JSON.stringify(body)];
      });
    });
  },
  teardown: function() {
    Ember.run(App, 'destroy');
    server.shutdown();
  }
});

test('it works when meta is present in payload', function(assert) {
  visit('/');

  andThen(function() {
    var postsTitle     = find('#posts-title');
    var postList       = find('ul');
    var infinityLoader = find('.infinity-loader');

    assert.equal(postsTitle.text(), "Listing Posts");
    assert.equal(postList.find('li').length, 6);
    assert.equal(infinityLoader.hasClass('reached-infinity'), true);
  });
});

test('it works with parameters', function(assert) {
  visit('/category/a?per_page=2');

  andThen(function() {
    var postsTitle     = find('#posts-title');
    var postList       = find('ul');
    var infinityLoader = find('.infinity-loader');

    assert.equal(postsTitle.text(), "Listing Posts using Parameters");
    assert.equal(postList.find('li').length, 2);
    assert.equal(postList.find('li:first-child').text(), "Squarepusher");
    assert.equal(infinityLoader.hasClass('reached-infinity'), false);
  });
});
