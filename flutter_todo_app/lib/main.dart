import 'package:flutter/material.dart';

void main() => runApp(const TodoApp());

class TodoApp extends StatelessWidget {
  const TodoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter TODO',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.indigo,
        useMaterial3: true,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.indigo,
        useMaterial3: true,
        brightness: Brightness.dark,
      ),
      themeMode: ThemeMode.system,
      home: const TodoListPage(),
    );
  }
}

class TodoListPage extends StatefulWidget {
  const TodoListPage({super.key});

  @override
  State<TodoListPage> createState() => _TodoListPageState();
}

class _TodoListPageState extends State<TodoListPage> {
  final List<TodoTask> _tasks = [];
  final TextEditingController _controller = TextEditingController();

  void _addTask() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _tasks.add(TodoTask(text));
    });
    _controller.clear();
  }

  void _toggleTask(int index) {
    setState(() {
      _tasks[index].isDone = !_tasks[index].isDone;
    });
  }

  void _deleteTask(int index) {
    setState(() {
      _tasks.removeAt(index);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final doneCount = _tasks.where((t) => t.isDone).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('TODO'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'What needs to be done?',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                    onSubmitted: (_) => _addTask(),
                  ),
                ),
                const SizedBox(width: 12),
                FilledButton.icon(
                  onPressed: _addTask,
                  icon: const Icon(Icons.add),
                  label: const Text('Add'),
                ),
              ],
            ),
          ),
          if (_tasks.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    '$_doneCount / ${_tasks.length} done',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const Spacer(),
                  if (_tasks.any((t) => t.isDone))
                    TextButton(
                      onPressed: () {
                        setState(() => _tasks.removeWhere((t) => t.isDone));
                      },
                      child: const Text('Clear completed'),
                    ),
                ],
              ),
            ),
          const Divider(),
          Expanded(
            child: _tasks.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.task_alt,
                          size: 64,
                          color: Theme.of(context).colorScheme.outline,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nothing here yet',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Theme.of(context).colorScheme.outline,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _tasks.length,
                    itemBuilder: (context, index) {
                      final task = _tasks[index];
                      return Dismissible(
                        key: ValueKey(task.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          color: Theme.of(context).colorScheme.error,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 24),
                          child: Icon(Icons.delete,
                            color: Theme.of(context).colorScheme.onError,
                          ),
                        ),
                        onDismissed: (_) => _deleteTask(index),
                        child: CheckboxListTile(
                          value: task.isDone,
                          onChanged: (_) => _toggleTask(index),
                          title: Text(
                            task.text,
                            style: TextStyle(
                              decoration: task.isDone
                                  ? TextDecoration.lineThrough
                                  : null,
                              color: task.isDone
                                  ? Theme.of(context).colorScheme.outline
                                  : null,
                            ),
                          ),
                          secondary: IconButton(
                            icon: Icon(Icons.delete_outline,
                              color: Theme.of(context).colorScheme.error,
                            ),
                            onPressed: () => _deleteTask(index),
                          ),
                          controlAffinity: ListTileControlAffinity.leading,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class TodoTask {
  final String id;
  final String text;
  bool isDone;

  TodoTask(this.text, {this.isDone = false})
      : id = UniqueKey().toString();
}
