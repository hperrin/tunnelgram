import {Nymph, Entity} from 'nymph-client';

export class Todo extends Entity {
  // === Constructor ===

  constructor (id) {
    super(id);
    this.data.done = false;
  }

  // === Instance Methods ===

  archive (...args) {
    return this.serverCall('archive', args);
  }

  share (...args) {
    return this.serverCall('share', args);
  }

  unshare (...args) {
    return this.serverCall('unshare', args);
  }
}

// === Static Properties ===

// The name of the server class
Todo.class = 'MyApp\\Todo';

Nymph.setEntityClass(Todo.class, Todo);

export default Todo;
