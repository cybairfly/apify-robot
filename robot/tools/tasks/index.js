const log = require('../../logger');

const transformTasks = tasks =>
    Object
        .entries(tasks)
        .reduce((pool, [taskName, task]) =>
            pool = [...pool, {name: taskName, ...task}], []);

const resolveTaskTree = (bootTasks, taskNames) => {
    log.info('Resolving task dependency tree');

    taskNames = Array.isArray(taskNames) ? taskNames : [taskNames];

    const filterTasksByName = taskNames => taskNames.map(taskName => bootTasks.find(task => task.name === taskName));

    const getTreeByTaskName = (baseTasks, level = 0) =>
        baseTasks.reduce((pool, baseTask) => {
            if (level > 99)
                throw Error('Circular dependency detected');

            const mergeTasks = baseTask.merge && baseTask
                .merge
                .map(mergeTaskName =>
                    bootTasks.find(task =>
                        task.name === mergeTaskName));

            return pool = mergeTasks
                ? [
                    ...pool,
                    {
                        [baseTask.name]: [
                            baseTask,
                            ...getTreeByTaskName(mergeTasks, ++level),
                        ],
                    }]
                : [
                    ...pool,
                    {
                        [baseTask.name]: [
                            baseTask,
                        ],
                    },
                ];
        }, []);

    const treeByTask = getTreeByTaskName(filterTasksByName(taskNames));

    const getTaskList = treeByTask => treeByTask.flatMap(treePerTask => {
        const getFlatDepsPerTask = treePerTask => {
            return Object.keys(treePerTask).flatMap(taskName => {
                return treePerTask[taskName].flatMap(task => {
                    return task.name ? task : getFlatDepsPerTask(task);
                });
            });
        };

        const taskList = getFlatDepsPerTask(treePerTask);

        return taskList.reverse();
    });

    const taskList = getTaskList(treeByTask);
    const taskListNames = taskList.map(task => task.name);

    const getTreeJson = treeByTask =>
        JSON.stringify(treeByTask.map(taskTree =>
            Object.keys(taskTree).map(taskName =>
                taskTree[taskName])), [...taskListNames, 'name', 'merge'], '**');

    console.log(getTreeJson(treeByTask));
    log.info('Dependency tree resolved');

    return taskList;
};

module.exports = {
    transformTasks,
    resolveTaskTree,
};
