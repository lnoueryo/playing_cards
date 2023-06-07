interface ModelBase {
    toJson(): any
}


class ModelBase implements ModelBase {

    constructor(readonly created_at: string, readonly updated_at: string) {}

}

export { ModelBase}